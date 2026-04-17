declare module 'react-qr-scanner' {
  export interface QrScannerProps {
    onDecode: (result: string) => void
    onError: (error: Error) => void
    constraints?: MediaStreamConstraints
    videoStyle?: React.CSSProperties
    videoContainerStyle?: React.CSSProperties
  }

  export class QrScanner extends React.Component<QrScannerProps> {}
}
