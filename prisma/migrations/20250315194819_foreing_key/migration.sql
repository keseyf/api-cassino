-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_email_fkey" FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
