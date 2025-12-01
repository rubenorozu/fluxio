'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function TestFileInput() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.onload = () => {

        setImageDataUrl(reader.result as string);

      };
      reader.readAsDataURL(file);
    } else {

    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid gray' }}>
      <h3>Componente de Prueba de Input de Archivo</h3>
      <input type="file" onChange={handleFileChange} />
      {imageDataUrl && (
        <div>
          <p>Imagen cargada:</p>
          <Image src={imageDataUrl} alt="Preview" width={200} height={200} style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
