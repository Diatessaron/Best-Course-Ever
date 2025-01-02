type OptionalId<T> = Omit<T, '_id'> & { _id?: string };
