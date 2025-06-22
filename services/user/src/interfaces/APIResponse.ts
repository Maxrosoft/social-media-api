interface APIResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data?: any;
}

export default APIResponse;
