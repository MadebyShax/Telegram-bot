import JSZip from 'jszip';
import { PYTHON_CODEBASE_FILES } from '../data/pythonCodebase';

export async function downloadPythonProjectZip(): Promise<void> {
  const zip = new JSZip();

  // All bot files (including .env.example and README.md) come from the generated
  // pythonCodebase.ts, so the ZIP always matches the real repository code.
  for (const file of PYTHON_CODEBASE_FILES) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'EcommerceAICardBot-HuggingFace-Aiogram3.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
