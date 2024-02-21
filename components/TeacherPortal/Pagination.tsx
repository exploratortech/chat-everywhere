import { Pagination as PaginationType } from '@/types/pagination';

import {
  Pagination as PaginationContainer,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const Pagination = ({
  pagination,
  handlePageChange,
}: {
  pagination: PaginationType;
  handlePageChange: (page: number) => void;
}) => {
  const prevButtonHidden = pagination.current_page <= 1 ? 'hidden' : '';
  const nextButtonHidden =
    pagination.current_page >= pagination.total_pages ? 'hidden' : '';

  const handlePrevious = () => {
    if (pagination.current_page > 1) {
      handlePageChange(pagination.current_page - 1);
    }
  };

  const handleNext = () => {
    if (pagination.current_page < pagination.total_pages) {
      handlePageChange(pagination.current_page + 1);
    }
  };

  const maxPageToShow = 3;
  let startPage = Math.max(pagination.current_page - 2, 1);
  let endPage = Math.min(startPage + maxPageToShow - 1, pagination.total_pages);

  if (endPage - startPage + 1 < maxPageToShow) {
    startPage = Math.max(endPage - maxPageToShow + 1, 1);
  }

  return (
    <PaginationContainer>
      <PaginationContent>
        <PaginationItem className={prevButtonHidden}>
          <PaginationPrevious href="#" onClick={handlePrevious} />
        </PaginationItem>
        {/* Dynamic Pagination Links */}
        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink href="#" onClick={() => handlePageChange(1)}>
                1
              </PaginationLink>
            </PaginationItem>
            {startPage > 2 && <PaginationEllipsis>&hellip;</PaginationEllipsis>}
          </>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
          <PaginationItem key={startPage + index}>
            <PaginationLink
              href="#"
              onClick={() => handlePageChange(startPage + index)}
              isActive={pagination.current_page === startPage + index}
            >
              {startPage + index}
            </PaginationLink>
          </PaginationItem>
        ))}
        {pagination.total_pages > endPage && (
          <>
            {pagination.total_pages > endPage + 1 && (
              <PaginationEllipsis>&hellip;</PaginationEllipsis>
            )}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={() => handlePageChange(pagination.total_pages)}
              >
                {pagination.total_pages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        <PaginationItem className={nextButtonHidden}>
          <PaginationNext href="#" onClick={handleNext} />
        </PaginationItem>
      </PaginationContent>
    </PaginationContainer>
  );
};
export default Pagination;
