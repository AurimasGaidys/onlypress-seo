export const txtExtractor = () => {
    const decode = (str: string): string => Buffer.from(str, 'base64').toString('binary');

    return {
        extract: (fileBase64: string): string => {
            return decode(fileBase64);
        }
    };
}
