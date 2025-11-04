import PhotoUploadZone from '../PhotoUploadZone';

export default function PhotoUploadZoneExample() {
  return (
    <PhotoUploadZone 
      onPhotosChange={(photos) => console.log('Photos changed:', photos.length)}
    />
  );
}
