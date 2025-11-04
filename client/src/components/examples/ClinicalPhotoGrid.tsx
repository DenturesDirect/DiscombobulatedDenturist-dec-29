import ClinicalPhotoGrid from '../ClinicalPhotoGrid';

const samplePhotos = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    description: 'Initial impression'
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    description: 'Bite registration'
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
];

export default function ClinicalPhotoGridExample() {
  return (
    <ClinicalPhotoGrid 
      photos={samplePhotos}
      onDelete={(id) => console.log('Delete photo:', id)}
    />
  );
}
