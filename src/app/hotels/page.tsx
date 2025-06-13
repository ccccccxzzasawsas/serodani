import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'საუკეთესო სასტუმროები | Hotels in Georgia | Best Hotels',
  description: 'აღმოაჩინე საუკეთესო სასტუმროები საქართველოში. დაჯავშნე ახლავე კომფორტული ოთახები აუზით, ხედებითა და მაღალი ხარისხის სერვისით.',
  keywords: 'hotels, სასტუმროები, საქართველოს სასტუმროები, hotels in georgia',
  openGraph: {
    title: 'საუკეთესო სასტუმროები | Hotels in Georgia | Best Hotels',
    description: 'აღმოაჩინე საუკეთესო სასტუმროები საქართველოში. დაჯავშნე ახლავე კომფორტული ოთახები აუზით, ხედებითა და მაღალი ხარისხის სერვისით.',
    url: 'https://შენი-საიტი.ge/hotels',
    images: [
      {
        url: 'https://შენი-საიტი.ge/images/cover.jpg',
        width: 1200,
        height: 630,
        alt: 'საუკეთესო სასტუმროები საქართველოში',
      },
    ],
  },
};

export default function Hotels() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">საუკეთესო სასტუმროები</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">პოპულარული სასტუმროები საქართველოში</h2>
        <p className="mb-4">
          აღმოაჩინეთ საქართველოს საუკეთესო სასტუმროები, რომლებიც გთავაზობენ მაღალი ხარისხის მომსახურებას, 
          კომფორტულ ნომრებს და შესანიშნავ ხედებს. ჩვენი სასტუმროები იდეალურია როგორც დასვენებისთვის, 
          ისე ბიზნეს მოგზაურობისთვის.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/hotel-1.jpg" 
                alt="ლუქს სასტუმრო საქართველოში აუზით" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">ლუქს სასტუმრო</h3>
              <p>უმაღლესი ხარისხის სასტუმრო აუზით და რესტორნით, შესანიშნავი ხედებით.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/hotel-2.jpg" 
                alt="საოჯახო სასტუმრო კომფორტული ნომრებით" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">საოჯახო სასტუმრო</h3>
              <p>მყუდრო საოჯახო სასტუმრო თბილი ატმოსფეროთი და საუკეთესო მომსახურებით.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/hotel-3.jpg" 
                alt="ბიზნეს სასტუმრო საკონფერენციო დარბაზებით" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">ბიზნეს სასტუმრო</h3>
              <p>თანამედროვე ბიზნეს სასტუმრო საკონფერენციო დარბაზებით და მაღალი ხარისხის მომსახურებით.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">რატომ აირჩიოთ ჩვენი სასტუმროები</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>უმაღლესი ხარისხის მომსახურება</li>
          <li>კომფორტული და თანამედროვე ნომრები</li>
          <li>მრავალფეროვანი სამზარეულო</li>
          <li>შესანიშნავი მდებარეობა</li>
          <li>პერსონალური მიდგომა თითოეული სტუმრისადმი</li>
        </ul>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">დაჯავშნეთ სასტუმრო ახლავე</h2>
        <p className="mb-4">
          დაგვიკავშირდით და დაჯავშნეთ სასტუმრო თქვენი შემდეგი მოგზაურობისთვის. ჩვენი გუნდი მზადაა 
          დაგეხმაროთ საუკეთესო არჩევანის გაკეთებაში და უზრუნველყოს თქვენი კომფორტული დასვენება.
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
          დაჯავშნა
        </button>
      </section>
      
      {/* Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Hotel',
            'name': 'საქართველოს ლუქს სასტუმრო',
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': 'თბილისი',
              'addressRegion': 'თბილისი',
              'addressCountry': 'GE'
            },
            'amenityFeature': [
              { '@type': 'LocationFeatureSpecification', 'name': 'აუზი', 'value': true },
              { '@type': 'LocationFeatureSpecification', 'name': 'Wi-Fi', 'value': true },
              { '@type': 'LocationFeatureSpecification', 'name': 'რესტორანი', 'value': true }
            ]
          })
        }}
      />
    </main>
  );
} 