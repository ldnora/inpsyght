import { getItemBySlug } from "@/actions/items.action";
import ImageCarousel from "@/components/ImageCarousel";
import ItemVisitTracker from "@/components/ItemVisitTracker";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const slug = (await params).slug;
  const res = await getItemBySlug(slug);
  if (res.success && res.data) {
    return {
      title: `${res.data.name} (${res.data.scientificName}) - Jardim Botânico UFSM`,
      description: res.data.description || "Item do Jardim Botânico UFSM",
    };
  }
  return {
    title: "Item não encontrado - Jardim Botânico UFSM",
    description: "Item não encontrado no Jardim Botânico UFSM",
  };
}

export default async function ItemPage({ params }: Props) {
  const slug = (await params).slug;
  const res = await getItemBySlug(slug);
  if (!res.success || !res.data) {
    notFound();
  }
  const item = res.data;
  const itemImages = 'images' in item ? item.images : [];
  
  return (
    <div className="flex-1 flex flex-col">
      <ItemVisitTracker itemSlug={slug} />
      <div className="container py-6 sm:py-8 md:py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 h-full">
          {/* Item information - sempre primeiro em mobile */}
          <div className="order-1 lg:order-2 px-2 sm:px-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-2 leading-tight">{item.name}</h1>
            <h2 className="text-lg sm:text-xl lg:text-2xl italic text-green-800 mb-4 leading-relaxed">{item.scientificName}</h2>
            
            {/* Image carousel - aparece aqui em mobile, escondido em desktop */}
            <div className="block lg:hidden mb-6">
              <ImageCarousel images={itemImages} itemName={item.name} />
            </div>
            
            {item.description && (
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Descrição</h3>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{item.description}</p>
              </div>
            )}
            {item.habitat && (
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Habitat</h3>
                <p className="text-gray-700 text-sm sm:text-base">{item.habitat}</p>
              </div>
            )}
          </div>
          
          {/* Image carousel - aparece aqui em desktop */}
          <div className="hidden lg:block lg:order-1">
            <ImageCarousel images={itemImages} itemName={item.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
