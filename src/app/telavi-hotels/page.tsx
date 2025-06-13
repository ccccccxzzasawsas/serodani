import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'სასტუმროები თელავში | აუზით, ხედებით | Hotels in Kakheti',
  description: 'აღმოაჩინე საუკეთესო სასტუმროები თელავში და კახეთის რეგიონში. დაჯავშნე აუზით, ხედით და კომფორტით.',
  keywords: 'სასტუმროები თელავში, კახეთის სასტუმროები, hotels in kakheti, telavi hotels, hotel pool telavi',
  openGraph: {
    title: 'სასტუმროები თელავში - აუზით, ხედებით | Hotels in Kakheti',
    description: 'აღმოაჩინე საუკეთესო სასტუმროები თელავში და კახეთში. დაჯავშნე ახლა.',
    url: 'https://შენი-საიტი.ge/telavi-hotels',
    images: [
      {
        url: 'https://შენი-საიტი.ge/images/telavi-hotel.jpg',
        width: 1200,
        height: 630,
        alt: 'სასტუმროები თელავში',
      },
    ],
  },
};

export default function TelaviHotels() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">სასტუმროები თელავში</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">აუზიანი სასტუმროები კახეთში</h2>
        <p className="mb-4">
          თელავი, კახეთის რეგიონის ცენტრი, გამოირჩევა არა მხოლოდ თავისი ისტორიული ძეგლებით, 
          არამედ შესანიშნავი სასტუმროებითაც. აღმოაჩინეთ საუკეთესო სასტუმროები თელავში, 
          სადაც შეგიძლიათ დაისვენოთ აუზთან, დატკბეთ ქალაქის და ალაზნის ველის ხედებით 
          და დააგემოვნოთ ნამდვილი კახური სამზარეულო.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/telavi-hotel-1.jpg" 
                alt="ლუქს სასტუმრო თელავში აუზით" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">თელავის პალასი</h3>
              <p>ლუქს სასტუმრო თელავის ცენტრში აუზით, რესტორნით და ბარით.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/telavi-hotel-2.jpg" 
                alt="ბუტიკ სასტუმრო თელავში" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">თელავის ბუტიკ ჰოტელი</h3>
              <p>მყუდრო ბუტიკ სასტუმრო თელავში, ახლოს ძირითად ღირსშესანიშნაობებთან.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/telavi-hotel-3.jpg" 
                alt="ოჯახური სასტუმრო თელავში" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">თელავის მარანი</h3>
              <p>ოჯახური სასტუმრო თელავში, სადაც შეგიძლიათ დააგემოვნოთ ნამდვილი ოჯახური ღვინო.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h3 className="text-xl font-semibold mb-4">ლუქს ნომრები, ხედებით და საუზმით</h3>
        <p className="mb-4">
          თელავის სასტუმროები გთავაზობთ კომფორტულ და ლუქს ნომრებს შესანიშნავი ხედებით.
          დილის საუზმე შედგება ადგილობრივი, ახალი პროდუქტებისგან, რაც იდეალურია დღის დასაწყებად
          და ქალაქის დასათვალიერებლად.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-64">
              <Image 
                src="/images/telavi-room-1.jpg" 
                alt="ლუქს ნომერი თელავის სასტუმროში" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">პრემიუმ ნომერი</h3>
              <p>კომფორტული პრემიუმ ნომერი ორი ადამიანისთვის, საიდანაც იშლება ქალაქის ხედი.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-64">
              <Image 
                src="/images/telavi-room-2.jpg" 
                alt="საოჯახო ნომერი თელავის სასტუმროში" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">საოჯახო ნომერი</h3>
              <p>ფართო ნომერი ოჯახისთვის, აღჭურვილი ყველა საჭირო კომფორტით.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">რატომ უნდა ესტუმროთ თელავს</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>თელავი არის კახეთის რეგიონის ცენტრი, სადაც შეგიძლიათ ესტუმროთ ისტორიულ ძეგლებს</li>
          <li>ქალაქში და მის შემოგარენში მდებარეობს მრავალი ღვინის მარანი</li>
          <li>შესანიშნავი ხედი კავკასიონის მთებზე და ალაზნის ველზე</li>
          <li>ტრადიციული კახური სამზარეულო</li>
          <li>ახლოსაა კახეთის ყველა მთავარ ღირსშესანიშნაობასთან</li>
        </ul>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">ღირსშესანიშნაობები თელავის მახლობლად</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/telavi-attraction-1.jpg" 
                alt="ალავერდის მონასტერი თელავთან ახლოს" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">ალავერდის მონასტერი</h3>
              <p>ისტორიული მონასტერი XI საუკუნიდან, თელავიდან 20 წუთის სავალზე.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/telavi-attraction-2.jpg" 
                alt="ბატონის ციხე თელავში" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">ბატონის ციხე</h3>
              <p>XVIII საუკუნის სამეფო რეზიდენცია თელავის ცენტრში.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/telavi-attraction-3.jpg" 
                alt="ძველი თელავი, ისტორიული უბანი" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">ძველი თელავი</h3>
              <p>ისტორიული უბანი თელავში, სადაც შეგიძლიათ იხილოთ ტრადიციული არქიტექტურა.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">დაჯავშნეთ სასტუმრო თელავში ახლავე</h2>
        <p className="mb-4">
          დაგვიკავშირდით და დაჯავშნეთ სასტუმრო თქვენი შემდეგი მოგზაურობისთვის თელავში. ჩვენი გუნდი მზადაა 
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
            'name': 'თელავის ლუქს სასტუმრო',
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': 'თელავი',
              'addressRegion': 'კახეთი',
              'addressCountry': 'GE'
            },
            'amenityFeature': [
              { '@type': 'LocationFeatureSpecification', 'name': 'აუზი', 'value': true },
              { '@type': 'LocationFeatureSpecification', 'name': 'უფასო Wi-Fi', 'value': true },
              { '@type': 'LocationFeatureSpecification', 'name': 'რესტორანი', 'value': true }
            ]
          })
        }}
      />
    </main>
  );
} 