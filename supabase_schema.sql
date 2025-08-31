-- Friend requests for pending friendships
CREATE TABLE public.friend_requests (
  requester uuid NOT NULL,
  requestee uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT friend_requests_pkey PRIMARY KEY (requester, requestee),
  CONSTRAINT friend_requests_requester_fkey FOREIGN KEY (requester) REFERENCES auth.users(id),
  CONSTRAINT friend_requests_requestee_fkey FOREIGN KEY (requestee) REFERENCES auth.users(id)
);

