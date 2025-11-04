import ToothShadeCard from '../ToothShadeCard';

export default function ToothShadeCardExample() {
  return (
    <div className="space-y-4">
      <ToothShadeCard currentShade="A2" requestedShade="B1" />
      <ToothShadeCard currentShade="A3" showAlert />
      <ToothShadeCard showAlert />
    </div>
  );
}
