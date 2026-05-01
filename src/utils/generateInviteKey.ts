export const generateInviteKey = (stringToReplace: string): string => {
    return stringToReplace.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').replaceAll(/\./g, '-').toLowerCase()
};
