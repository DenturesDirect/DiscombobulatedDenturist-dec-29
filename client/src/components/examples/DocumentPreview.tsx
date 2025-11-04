import DocumentPreview from '../DocumentPreview';

const sampleContent = `CLINICAL NOTE

Patient: Sarah Johnson
Date: November 4, 2025
Provider: Dr. Damien Smith

Chief Complaint:
Patient presents for complete upper denture fabrication consultation.

Clinical Examination:
Oral examination reveals complete edentulism in the maxillary arch. Ridge is well-healed with adequate bone height and width. Minimal resorption noted in anterior region. Palatal vault demonstrates good depth and form. 

Soft tissues appear healthy with no signs of inflammation or pathology. Patient exhibits Class I jaw relationship with adequate interarch space.

Treatment Plan:
1. Fabricate complete maxillary denture
2. Initial impressions scheduled for next visit
3. Patient education provided regarding care and expectations

Next Steps:
- Schedule metal design appointment
- Review shade selection at next visit
- Patient to return in 2 weeks for impressions`;

export default function DocumentPreviewExample() {
  return (
    <DocumentPreview 
      content={sampleContent}
      onRewrite={(text) => console.log('Rewrite:', text)}
    />
  );
}
