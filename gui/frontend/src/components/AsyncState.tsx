import type { ReactNode } from "react";

interface AsyncStateProps{
    isLoading: boolean;
    error?: string | null;
    isEmpty?: boolean;
    children: ReactNode;
}

export function AsyncState({isLoading, error, isEmpty, children} : AsyncStateProps){
    if(isLoading){
        return (
            <p className="mt-2 flex items-center gap-2 text-gray-500">
                <span className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
                Loading ...
            </p>
        );
    }

    if (error) {
        return (
            <p className="mt-2 text-red-600"> {error} </p>
        );
    }

    if (isEmpty) {
        return (
            <p className="mt-2 text-gray-500"> No data avaliable </p>
        );
    }

    return <>{children}</>;
}