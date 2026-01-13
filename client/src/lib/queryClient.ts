import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:3',message:'throwIfResNotOk - res not ok',data:{status:res.status,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || json.message || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // Use default error message
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:19',message:'throwIfResNotOk throwing error',data:{errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:23',message:'apiRequest entry',data:{method,url,hasData:!!data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:35',message:'apiRequest after fetch',data:{status:res.status,statusText:res.statusText,ok:res.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  try {
    await throwIfResNotOk(res);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:38',message:'apiRequest success',data:{status:res.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return res;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:41',message:'apiRequest error',data:{status:res.status,errorMessage:error?.message,errorType:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    for (let i = 1; i < queryKey.length; i++) {
      const segment = queryKey[i];
      if (typeof segment === 'string') {
        url += `/${segment}`;
      } else if (typeof segment === 'object' && segment !== null) {
        const params = new URLSearchParams();
        Object.entries(segment).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
