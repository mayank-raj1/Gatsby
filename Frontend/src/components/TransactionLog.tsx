// src/components/dashboard/TransactionLog.tsx
import { useState, useMemo } from 'react'
import { Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Card }   from '@/components/ui/card'


function deleteTransaction(id) {

}

export default function TransactionLog({ transactions }) {
    // sort newest→oldest
    const sorted = useMemo(
        ()=>[...transactions].sort((a,b)=> new Date(b.date).getTime()-new Date(a.date).getTime()),
        [transactions]
    )

    const PAGE_SIZE = 10
    const [page, setPage] = useState(0)
    const current = sorted.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE)

    return (
        <>
            <Input placeholder="Search…" onChange={…} />
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {current.map(t=>(
                <Card key={t.id}>
                    {/* your brutalist layout… */}
                    <div className="flex justify-between">
            <div>
                <p>{t.description}</p>
            <p className="text-xs text-gray-500">{t.category}</p>
            </div>
            <div>
            {t.type==='income'?<ArrowUpRight/>:<ArrowDownRight/>}
            ${Math.round(t.amount)}
                <Button variant="ghost" onClick={()=>deleteTransaction(t.id)}><Trash2/></Button>
    </div>
    </div>
    </Card>
))}
    </div>

    <div className="flex justify-between mt-2">
    <Button disabled={page===0} onClick={()=>setPage(p=>p-1)}>← Back</Button>
    <Button disabled={(page+1)*PAGE_SIZE>=sorted.length} onClick={()=>setPage(p=>p+1)}>More →</Button>
    </div>
    </>
)
}
