-- Communication schema extension for T-018

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  participant_a_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  participant_b_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chat_threads_participants_unique UNIQUE (company_id, participant_a_user_id, participant_b_user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meeting_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  requester_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  agenda TEXT,
  preferred_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat threads" ON public.chat_threads;
CREATE POLICY "Users can view own chat threads"
  ON public.chat_threads FOR SELECT
  USING (participant_a_user_id = auth.uid() OR participant_b_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create chat threads in company" ON public.chat_threads;
CREATE POLICY "Users can create chat threads in company"
  ON public.chat_threads FOR INSERT
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (participant_a_user_id = auth.uid() OR participant_b_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.chat_messages;
CREATE POLICY "Users can view messages in their threads"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (t.participant_a_user_id = auth.uid() OR t.participant_b_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their threads" ON public.chat_messages;
CREATE POLICY "Users can send messages in their threads"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid()
    AND company_id = public.get_current_company_id()
    AND EXISTS (
      SELECT 1
      FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (t.participant_a_user_id = auth.uid() OR t.participant_b_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own meeting requests" ON public.meeting_requests;
CREATE POLICY "Users can view own meeting requests"
  ON public.meeting_requests FOR SELECT
  USING (requester_user_id = auth.uid() OR recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create meeting requests in company" ON public.meeting_requests;
CREATE POLICY "Users can create meeting requests in company"
  ON public.meeting_requests FOR INSERT
  WITH CHECK (
    requester_user_id = auth.uid()
    AND company_id = public.get_current_company_id()
  );

DROP POLICY IF EXISTS "Recipient can update meeting request status" ON public.meeting_requests;
CREATE POLICY "Recipient can update meeting request status"
  ON public.meeting_requests FOR UPDATE
  USING (recipient_user_id = auth.uid() OR requester_user_id = auth.uid());

DROP TRIGGER IF EXISTS chat_threads_updated_at ON public.chat_threads;
CREATE TRIGGER chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS meeting_requests_updated_at ON public.meeting_requests;
CREATE TRIGGER meeting_requests_updated_at
  BEFORE UPDATE ON public.meeting_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
