import mammoth from 'mammoth/mammoth.browser';

export const wordDocExtractor = () => {

    return {
        extract: async (file: File) => {
            try {
                // Convert File to Buffer
                const arrayBuffer = await file.arrayBuffer();
                // const buffer = Buffer.from(arrayBuffer);

                mammoth.extractRawText({arrayBuffer: arrayBuffer})
                    .then(function (result) {
                        // const text = result.value; // The raw text
                        // const messages = result.messages;

                        console.log("mamooth rezult:",result);
                    })
                    .catch(function (error) {
                        console.error(error);
                    });

                // Convert Docx to HTML
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });

                // Output results
                console.log("HTML Output:", result.value);

                // Log warnings (e.g., if fonts or images were missing)
                if (result.messages.length > 0) {
                    console.log("Messages:", result.messages);
                }

                return result.value;

            } catch (error) {
                console.error("Error converting file:", error);
            }
        }
    };
}
