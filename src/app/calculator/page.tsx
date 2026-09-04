import { prisma } from '@/lib/prisma'
import { BudgetCalculator, CalculatorPackage } from '@/components/BudgetCalculator'

export const dynamic = 'force-dynamic'

export default async function CalculatorPage() {
  const packages = await prisma.equipmentPackage.findMany({
    where: { active: true },
    select: {
      businessType: true,
      name: true,
      equipmentItems: { select: { monthlyFee: true, optional: true } },
    },
  })

  const mapped: CalculatorPackage[] = packages.map((p) => ({
    businessType: p.businessType,
    name: p.name,
    requiredMonthly: p.equipmentItems
      .filter((i) => !i.optional)
      .reduce((s, i) => s + i.monthlyFee, 0),
    fullMonthly: p.equipmentItems.reduce((s, i) => s + i.monthlyFee, 0),
  }))

  return (
    <div className="vs-container py-8">
      <h1 className="text-[28px] font-bold tracking-tight">내 예산으로 가능한 창업</h1>
      <p className="mb-6 mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
        가진 돈을 넣으면 어떤 업종을 몇 개월 동안 해볼 수 있는지, 어떤 공간이 가능한지 바로 계산합니다.
        모든 금액은 가정값이며 실제 견적이 아닙니다.
      </p>
      <BudgetCalculator packages={mapped} />
    </div>
  )
}
