import path from 'path';

import ts from 'typescript';

import { stdout } from '../src/helpers/spawn.js';

interface JSONSchemaPrimitive {
  type: 'number' | 'string' | 'boolean' | 'bytes' | 'null';
}

interface JSONSchemaRef {
  type: 'ref';
  tag: string;
}

interface JSONSchemaObject {
  type: 'object';
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: JSONSchema | boolean;
}

interface JSONSchemaAny {
  type: 'any';
}

interface JSONSchemaUnion {
  type: 'union';
  anyOf: JSONSchema[];
}

interface JSONSchemaArray {
  type: 'array';
  items?: JSONSchema;
  prefixItems?: JSONSchema[];
}

type JSONSchema =
  | JSONSchemaPrimitive
  | JSONSchemaObject
  | JSONSchemaArray
  | JSONSchemaAny
  | JSONSchemaUnion
  | JSONSchemaRef;

interface RPCMethod {
  parameters: JSONSchemaObject;
  returns: JSONSchema;
  is_autoref: boolean;
}

interface RPCNamespace {
  methods: Record<string, RPCMethod>;
}

interface RPCSchema {
  namespaces: Record<string, RPCNamespace>;
}

const data = await stdout('python', [
  path.resolve('./src_python/rpc_generate_types.py'),
]);
const schema = JSON.parse(data) as RPCSchema;

function upperFirst(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1, str.length);
}

function toPascalCase(str: string) {
  return str.split('_').map(upperFirst).join('');
}

function toCamelCase(str: string) {
  return str
    .split('_')
    .map((str, i) => (i === 0 ? str : upperFirst(str)))
    .join('');
}

const questionToken = ts.factory.createToken(ts.SyntaxKind.QuestionToken);
const refTypeIdentifier = ts.factory.createIdentifier('RPCRef');
const bytesArgType = ts.factory.createTypeReferenceNode('Buffer');

function schemaToType(
  schema: JSONSchema,
  identifierTransform: (str: string) => string = str => str,
) {
  switch (schema.type) {
    case 'number':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'boolean':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    case 'string':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    case 'bytes':
      return bytesArgType;
    case 'null':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
    case 'object': {
      const elements: ts.TypeElement[] = [];
      if (schema.properties) {
        for (const [name, value] of Object.entries(schema.properties)) {
          elements.push(
            ts.factory.createPropertySignature(
              undefined,
              identifierTransform(name),
              schema.required?.includes(name) ? undefined : questionToken,
              schemaToType(value, identifierTransform),
            ),
          );
        }
      }
      if (schema.additionalProperties) {
        elements.push(
          ts.factory.createIndexSignature(
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                'K',
                undefined,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                undefined,
              ),
            ],
            typeof schema.additionalProperties === 'object'
              ? schemaToType(schema.additionalProperties, identifierTransform)
              : ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
          ),
        );
      }
      return ts.factory.createTypeLiteralNode(elements);
    }
    case 'array':
      if (schema.items) {
        return ts.factory.createArrayTypeNode(schemaToType(schema.items));
      }
      // TODO: Support tuples (prefixItems)
      break;
    case 'ref':
      return ts.factory.createTypeReferenceNode(refTypeIdentifier, [
        ts.factory.createLiteralTypeNode(
          ts.factory.createStringLiteral(schema.tag),
        ),
      ]);
    default:
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
  }
}

const anyType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
const argsIdentifier = ts.factory.createIdentifier('args');
const undefinedIdentifier = ts.factory.createIdentifier('undefined');

function buildApiFunction({
  functionName,
  namespaces,
  rpcIdentifier,
  rpcClassIdentifier,
  isSession,
}: {
  functionName: string;
  namespaces: Record<string, RPCNamespace>;
  rpcIdentifier: ts.Identifier;
  rpcClassIdentifier: ts.Identifier;
  isSession: boolean;
}) {
  const invokeExpression = ts.factory.createPropertyAccessExpression(
    rpcIdentifier,
    'invoke',
  );
  const nodes: ts.ObjectLiteralElementLike[] = [];

  for (const [namespaceName, namespace] of Object.entries(namespaces)) {
    const members: ts.ObjectLiteralElementLike[] = [];

    for (const [methodName, method] of Object.entries(namespace.methods)) {
      if (!isSession && method.is_autoref) {
        continue;
      }

      const parameters: ts.ParameterDeclaration[] = [];

      const rpcArgs: ts.Expression[] = [];

      if (!isSession) {
        rpcArgs.push(undefinedIdentifier);
      }

      rpcArgs.push(
        ts.factory.createStringLiteral(`${namespaceName}:${methodName}`),
      );

      if (Object.keys(method.parameters.properties!).length) {
        rpcArgs.push(
          ts.factory.createObjectLiteralExpression(
            Object.entries(method.parameters.properties!).map(([name]) =>
              ts.factory.createPropertyAssignment(
                name,
                ts.factory.createPropertyAccessExpression(
                  argsIdentifier,
                  toCamelCase(name),
                ),
              ),
            ),
            true,
          ),
        );
        parameters.push(
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            argsIdentifier,
            undefined,
            schemaToType(method.parameters, toCamelCase),
            undefined,
          ),
        );
      }

      members.push(
        ts.factory.createMethodDeclaration(
          undefined,
          undefined,
          toCamelCase(methodName),
          undefined,
          undefined,
          parameters,
          ts.factory.createTypeReferenceNode('Promise', [
            method.returns.type === 'null'
              ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
              : schemaToType(method.returns),
          ]),
          ts.factory.createBlock(
            [
              ts.factory.createReturnStatement(
                ts.factory.createAsExpression(
                  ts.factory.createCallExpression(
                    invokeExpression,
                    undefined,
                    rpcArgs,
                  ),
                  anyType,
                ),
              ),
            ],
            true,
          ),
        ),
      );
    }

    if (members.length) {
      nodes.push(
        ts.factory.createPropertyAssignment(
          toCamelCase(namespaceName),
          ts.factory.createObjectLiteralExpression(members, true),
        ),
      );
    }
  }

  return ts.factory.createFunctionDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    functionName,
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        rpcIdentifier,
        undefined,
        ts.factory.createTypeReferenceNode(rpcClassIdentifier),
        undefined,
      ),
    ],
    undefined,
    ts.factory.createBlock(
      [
        ts.factory.createReturnStatement(
          ts.factory.createObjectLiteralExpression(nodes, true),
        ),
      ],
      true,
    ),
  );
}

function importXFromY(x: ts.Identifier[], y: string) {
  return ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports(
        x.map(identifier =>
          ts.factory.createImportSpecifier(true, undefined, identifier),
        ),
      ),
    ),
    ts.factory.createStringLiteral(y),
    undefined,
  );
}

const rpcClassIdentifier = ts.factory.createIdentifier('RPC');
const sessionClassIdentifier = ts.factory.createIdentifier('RPCSession');

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const resultFile = ts.createSourceFile(
  'temp.ts',
  '',
  ts.ScriptTarget.Latest,
  false,
  ts.ScriptKind.TS,
);

const source = printer.printList(
  ts.ListFormat.MultiLine,
  ts.factory.createNodeArray([
    importXFromY([rpcClassIdentifier], './rpc.js'),
    importXFromY([sessionClassIdentifier], './session.js'),
    importXFromY([refTypeIdentifier], './types.js'),
    buildApiFunction({
      functionName: 'getApi',
      namespaces: schema.namespaces,
      rpcIdentifier: ts.factory.createIdentifier('rpc'),
      rpcClassIdentifier: rpcClassIdentifier,
      isSession: false,
    }),
    buildApiFunction({
      functionName: 'getSessionApi',
      namespaces: schema.namespaces,
      rpcIdentifier: ts.factory.createIdentifier('session'),
      rpcClassIdentifier: sessionClassIdentifier,
      isSession: true,
    }),
  ]),
  resultFile,
);

console.log(source);
