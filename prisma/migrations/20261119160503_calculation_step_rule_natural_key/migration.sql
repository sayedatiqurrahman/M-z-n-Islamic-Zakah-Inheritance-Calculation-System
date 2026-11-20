-- DropForeignKey
ALTER TABLE "calculation_step" DROP CONSTRAINT "calculation_step_ruleId_fkey";

-- AddForeignKey
ALTER TABLE "calculation_step" ADD CONSTRAINT "calculation_step_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fiqh_rule"("ruleId") ON DELETE SET NULL ON UPDATE CASCADE;
