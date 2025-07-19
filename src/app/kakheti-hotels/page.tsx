import { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'კახეთის სასტუმროები | აუზით, ხედებით | Hotels in Kakheti',
  description: 'აღმოაჩინე საუკეთესო სასტუმროები კახეთში. დაჯავშნე აუზით, ხედით და კომფორტით. გაეცანით კახეთის რეგიონის საუკეთესო სასტუმროებს.',
  keywords: 'კახეთის სასტუმროები, სასტუმროები კახეთში, hotels in kakheti, kakheti hotels, კახეთის ღვინის ტური, wooden cottages kakheti',
  openGraph: {
    title: 'კახეთის სასტუმროები | აუზით, ხედებით | Hotels in Kakheti',
    description: 'აღმოაჩინე საუკეთესო სასტუმროები კახეთში. დაჯავშნე აუზით, ხედით და კომფორტით.',
    url: 'https://შენი-საიტი.ge/kakheti-hotels',
    images: [
      {
        url: 'https://შენი-საიტი.ge/images/kakheti-hotel.jpg',
        width: 1200,
        height: 630,
        alt: 'კახეთის სასტუმროები',
      },
    ],
  },
};

export default function KakhetiHotels() {
  redirect('/');
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">კახეთის სასტუმროები</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">აუზიანი სასტუმროები კახეთში</h2>
        <p className="mb-4">
          <strong>კახეთის რეგიონი ცნობილია არა მხოლოდ თავისი უნიკალური ღვინით, არამედ შესანიშნავი სასტუმროებითაც.
          აღმოაჩინეთ საუკეთესო სასტუმროები კახეთში, სადაც შეგიძლიათ დაისვენოთ აუზთან, დატკბეთ
          ალაზნის ველის ხედებით და დააგემოვნოთ ნამდვილი ქართული სამზარეულო.</strong>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/kakheti-hotel-1.jpg" 
                alt="კახეთის სასტუმრო აუზით და ხედით ალაზნის ველზე" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">შატო კახეთი</h3>
              <p><strong>ლუქს სასტუმრო კახეთში აუზით, ღვინის სარდაფით და შესანიშნავი ხედით ალაზნის ველზე.</strong></p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/kakheti-hotel-2.jpg" 
                alt="ღვინის სასტუმრო კახეთში დეგუსტაციით" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">ღვინის სახლი</h3>
              <p><strong>სასტუმრო კახეთში, სადაც შეგიძლიათ დააგემოვნოთ ადგილობრივი ღვინო და გაეცნოთ ღვინის წარმოების ტრადიციებს.</strong></p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-48">
              <Image 
                src="/images/kakheti-hotel-3.jpg" 
                alt="ოჯახური სასტუმრო კახეთში ტრადიციული სამზარეულოთი" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">კახური ეზო</h3>
              <p><strong>ტრადიციული ოჯახური სასტუმრო კახეთში, სადაც შეგიძლიათ დააგემოვნოთ ნამდვილი კახური სამზარეულო.</strong></p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Wooden Cottages in the heart of Kakheti, Georgia</h2>
        <p className="mb-4">
          <strong>ეს ტექსტი მინდა bold გავხადოთ ადვილად რომ იკითხებოდეს</strong>
        </p>
        <p className="mb-4">
          Experience authentic Georgian hospitality in our charming wooden cottages nestled in the picturesque Kakheti region. These traditional cottages combine rustic charm with modern comforts, offering a unique stay surrounded by vineyards and breathtaking mountain views.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-64">
              <Image 
                src="/images/kakheti-cottage-1.jpg" 
                alt="Wooden cottage in Kakheti with vineyard view" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Vineyard Cottage</h3>
              <p><strong>ხის კოტეჯი ვენახის ხედით, იდეალური რომანტიული დასვენებისთვის კახეთის გულში.</strong></p>
              <p>Wooden cottage with vineyard views, perfect for a romantic getaway in the heart of Kakheti.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-64">
              <Image 
                src="/images/kakheti-cottage-2.jpg" 
                alt="Family wooden cottage in Kakheti mountains" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Mountain View Cottage</h3>
              <p><strong>საოჯახო ხის კოტეჯი კახეთის მთების ხედით, იდეალური ოჯახური დასვენებისთვის.</strong></p>
              <p>Family wooden cottage with mountain views, ideal for a family retreat in nature.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">ლუქს ნომრები, ხედებით და საუზმით</h2>
        <p className="mb-4">
          <strong>ჩვენი სასტუმროები გთავაზობთ კომფორტულ და ლუქს ნომრებს შესანიშნავი ხედებით.
          დილის საუზმე შედგება ადგილობრივი, ახალი პროდუქტებისგან, რაც იდეალურია დღის დასაწყებად.</strong>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-64">
              <Image 
                src="/images/kakheti-room-1.jpg" 
                alt="ლუქს ნომერი კახეთის სასტუმროში ხედით ალაზნის ველზე" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">ლუქს ნომერი ხედით</h3>
              <p><strong>კომფორტული ნომერი ორი ადამიანისთვის, საიდანაც იშლება შესანიშნავი ხედი ალაზნის ველზე.</strong></p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-md">
            <div className="relative h-64">
              <Image 
                src="/images/kakheti-room-2.jpg" 
                alt="საოჯახო ნომერი კახეთის სასტუმროში" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">საოჯახო ნომერი</h3>
              <p><strong>ფართო ნომერი ოჯახისთვის, აღჭურვილი ყველა საჭირო კომფორტით.</strong></p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">რატომ უნდა დაისვენოთ კახეთში</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>კახეთი არის ღვინის სამშობლო, სადაც შეგიძლიათ დააგემოვნოთ ნამდვილი ქართული ღვინო</strong></li>
          <li><strong>შესანიშნავი ბუნება და ხედები ალაზნის ველზე</strong></li>
          <li><strong>ისტორიული და კულტურული ძეგლები</strong></li>
          <li><strong>ტრადიციული კახური სამზარეულო</strong></li>
          <li><strong>ქართული სტუმართმოყვარეობა და თბილი მიღება</strong></li>
          <li><strong>ტრადიციული ხის კოტეჯები ავთენტური გამოცდილებისთვის</strong></li>
        </ul>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">დაჯავშნეთ კახეთის სასტუმრო ახლავე</h2>
        <p className="mb-4">
          <strong>დაგვიკავშირდით და დაჯავშნეთ სასტუმრო თქვენი შემდეგი მოგზაურობისთვის კახეთში. ჩვენი გუნდი მზადაა 
          დაგეხმაროთ საუკეთესო არჩევანის გაკეთებაში და უზრუნველყოს თქვენი კომფორტული დასვენება.</strong>
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
            'name': 'კახეთის ლუქს სასტუმრო',
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': 'კახეთი',
              'addressRegion': 'კახეთი',
              'addressCountry': 'GE'
            },
            'amenityFeature': [
              { '@type': 'LocationFeatureSpecification', 'name': 'აუზი', 'value': true },
              { '@type': 'LocationFeatureSpecification', 'name': 'ღვინის დეგუსტაცია', 'value': true },
              { '@type': 'LocationFeatureSpecification', 'name': 'უფასო საუზმე', 'value': true },
              { '@type': 'LocationFeatureSpecification', 'name': 'Wooden Cottages', 'value': true }
            ]
          })
        }}
      />
    </main>
  );
} 