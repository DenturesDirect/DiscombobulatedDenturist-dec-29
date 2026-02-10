import { UppyFile } from 'uppy';

export function ObjectUploader() {
    const onError = (error: any) => {
        console.error('Upload error: ', error);
        // Handle the error appropriately in your UI
    };

    const getUploadParameters = (file: UppyFile) => {
        // Create an upload parameters object
        const params = {
            // Your existing implementation goes here
        };
        // Ensure proper Content-Type header handling
        const contentType = file.type
            ? file.type
            : 'application/octet-stream';
        params.headers = {
            'Content-Type': contentType,
        };
        return params;
    };

    // Implement error handling in your upload logic
}
