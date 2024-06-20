export const inputValidation = ({ input, type, message }: { input: any; type: string; message: string }): void => {
    if (typeof input !== type) {
      throw new Error(message);
    }
  };
  