export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
  };
  
  export class FirestorePermissionError extends Error {
    public context: SecurityRuleContext;
  
    constructor(context: SecurityRuleContext) {
      const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
        {
          context,
        },
        null,
        2
      )}`;
      super(message);
      this.name = 'FirestorePermissionError';
      this.context = context;
  
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          throw this;
        }, 0);
      }
    }
  }
