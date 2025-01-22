import path from 'path';

import ts from 'typescript';

import { stdout } from '../src/helpers/spawn.js';

interface JSONSchemaPrimitive {
  type: 'number' | 'string' | 'boolean' | 'bytes';
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
  | JSONSchemaUnion;

interface RPCMethod {
  parameters: JSONSchemaObject;
  returns: JSONSchema;
}

interface RPCNamespace {
  methods: Record<string, RPCMethod>;
}

interface RPCSchema {
  namespaces: Record<string, RPCNamespace>;
}

const data = await stdout('python', [path.resolve('./python/rpc_types.py')]);
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
    case 'object': {
      const elements: ts.TypeElement[] = [];
      if (schema.properties) {
        for (const [name, value] of Object.entries(schema.properties)) {
          elements.push(
            ts.factory.createPropertySignature(
              undefined,
              identifierTransform(name),
              undefined,
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
    default:
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
  }
}

const anyType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
const rpcClassIdentifier = ts.factory.createIdentifier('ComfySession');
const rpcIdentifier = ts.factory.createIdentifier('session');
const invokeAccessExpression = ts.factory.createPropertyAccessExpression(
  rpcIdentifier,
  'invoke',
);
const argsIdentifier = ts.factory.createIdentifier('args');
const nodes: ts.ObjectLiteralElementLike[] = [];

for (const [namespaceName, namespace] of Object.entries(schema.namespaces)) {
  const members: ts.ObjectLiteralElementLike[] = [];

  for (const [methodName, method] of Object.entries(namespace.methods)) {
    const parameters: ts.ParameterDeclaration[] = [];

    if (Object.keys(method.parameters.properties!).length) {
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
          schemaToType(method.returns),
        ]),
        ts.factory.createBlock(
          [
            ts.factory.createReturnStatement(
              ts.factory.createAsExpression(
                ts.factory.createCallExpression(
                  invokeAccessExpression,
                  undefined,
                  [
                    ts.factory.createStringLiteral(
                      `${namespaceName}:${methodName}`,
                    ),
                    ts.factory.createObjectLiteralExpression(
                      Object.entries(method.parameters.properties!).map(
                        ([name]) =>
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
                  ],
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

  nodes.push(
    ts.factory.createPropertyAssignment(
      toCamelCase(namespaceName),
      ts.factory.createObjectLiteralExpression(members, true),
    ),
  );
}

const getApiFunction = ts.factory.createFunctionDeclaration(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  undefined,
  'getApi',
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

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const resultFile = ts.createSourceFile(
  'temp.ts',
  '',
  ts.ScriptTarget.Latest,
  false,
  ts.ScriptKind.TS,
);

const importNode = ts.factory.createImportDeclaration(
  undefined,
  ts.factory.createImportClause(
    false,
    undefined,
    ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(false, undefined, rpcClassIdentifier),
    ]),
  ),
  ts.factory.createStringLiteral('./index.js'),
  undefined,
);

const source = printer.printList(
  ts.ListFormat.MultiLine,
  ts.factory.createNodeArray([importNode, getApiFunction]),
  resultFile,
);

console.log(source);
