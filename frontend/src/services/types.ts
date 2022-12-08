export interface ResponseSingle<T> {
    data: T;
    status: 'success' | 'error';
    message?: string;
}

export interface ResponseMulti<T> {
    data: T[];
    status: 'success' | 'error';
    message?: string;
}

