export interface IPaginationParams {
    page: number;
    limit: number;
}

export type OrderByInput = Record<string, 'asc' | 'desc'>;

export interface IPrismaQueryOptions<WhereType = any> {
    where?: WhereType;
    include?: Record<string, boolean | object>;
    orderBy?: OrderByInput | OrderByInput[];
}

export type PrismaDelegate = {
    count: (args: any) => Promise<number>;
    findMany: (args: any) => Promise<any[]>;
};
