-- Allow sender to insert transfer transaction records for recipients
CREATE POLICY "Allow transfer inserts for recipients"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (type = 'transfert'::transaction_type);

-- Allow users to see transfers where they are the recipient
CREATE POLICY "Users can read received transfers"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());
