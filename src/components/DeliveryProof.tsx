import React, { useState } from 'react'
import { Camera, ImagePlus } from 'lucide-react'
import Button from './ui/Button'
import Card from './ui/Card'

export default function DeliveryProof({ onChange }: { onChange?: (files: File[]) => void }) {
  const [preview, setPreview] = useState<string | null>(null)

  const handle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange?.([file])
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-base font-black text-ink">Prueba de entrega</p>
        <p className="text-sm text-muted">Foto clara del producto entregado.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <Button asChild className="pointer-events-none w-full" size="lg">
            <span>
              <Camera size={18} />
              Tomar foto
            </span>
          </Button>
          <input onChange={handle} accept="image/*" capture="environment" type="file" className="hidden" />
        </label>
        <label>
          <Button asChild className="pointer-events-none w-full" variant="secondary" size="lg">
            <span>
              <ImagePlus size={18} />
              Subir foto
            </span>
          </Button>
          <input onChange={handle} accept="image/*" type="file" className="hidden" />
        </label>
      </div>
      {preview && <img src={preview} alt="Prueba de entrega" className="h-44 w-full rounded-2xl object-cover" />}
    </Card>
  )
}
