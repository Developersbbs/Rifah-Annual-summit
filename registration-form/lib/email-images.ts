import fs from 'fs'
import path from 'path'

export function getImageAsBase64(imageName: string): string {
    try {
        const imagePath = path.join(process.cwd(), 'public', 'assets', imageName)
        const imageBuffer = fs.readFileSync(imagePath)
        const base64 = imageBuffer.toString('base64')
        
        // Determine MIME type based on file extension
        const ext = path.extname(imageName).toLowerCase()
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'
        
        return `data:${mimeType};base64,${base64}`
    } catch (error) {
        console.error(`Error reading image ${imageName}:`, error)
        return ''
    }
}

export const emailImages = {
    mail1: getImageAsBase64('mail1.jpeg'),
    mail2: getImageAsBase64('mail2.jpeg'),
    logo: getImageAsBase64('logo.png')
}
