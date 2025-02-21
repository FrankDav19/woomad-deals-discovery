
import { Loader } from "lucide-react";
import { PromotionCard } from "@/components/PromotionCard";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DatabasePromotion } from "@/types/promotion";

interface PromotionsListProps {
  isLoading: boolean;
  promotions: DatabasePromotion[] | null;
  currentItems: DatabasePromotion[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  searchTerm: string;
}

export const PromotionsList = ({ 
  isLoading, 
  promotions, 
  currentItems, 
  currentPage, 
  totalPages, 
  setCurrentPage,
  searchTerm 
}: PromotionsListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-gray-500">Finding the best deals for you...</p>
      </div>
    );
  }

  if (!promotions?.length) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">No active promotions found</h2>
          <p className="text-gray-500">
            Check back later for new deals and promotions from your favorite stores.
          </p>
        </div>
      </div>
    );
  }

  if (currentItems.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">No matches found</h2>
          <p className="text-gray-500">
            Try adjusting your search terms to find more promotions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((promotion) => (
          <div key={promotion.id} className="transform transition-all duration-300 hover:scale-[1.02]">
            <PromotionCard promotion={promotion} />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-12">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.max(1, currentPage - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
