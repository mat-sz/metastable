export type FormDataObject = Record<string, string | string[] | undefined>;

export function formDataToObject(formData: FormData): FormDataObject {
  return Object.fromEntries(
    Array.from(formData.keys()).map(key => {
      const value =
        formData.getAll(key).length > 1
          ? formData.getAll(key)
          : formData.get(key);
      return [key, typeof value === 'string' ? value : undefined];
    }),
  );
}
