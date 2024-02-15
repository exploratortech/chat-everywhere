import ReactPaginate from 'react-paginate';

import { Pagination as PaginationType } from '@/types/pagination';

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

  return (
    <ReactPaginate
      previousLabel={'‹ Prev'}
      nextLabel={'Next ›'}
      breakLabel={'...'}
      pageCount={pagination.total_pages}
      marginPagesDisplayed={2}
      pageRangeDisplayed={5}
      onPageChange={(selectedItem) =>
        handlePageChange(selectedItem.selected + 1)
      }
      containerClassName={'flex justify-center gap-2'}
      activeClassName={
        'select-none px-1 !text-black bg-white border-neutral-800'
      }
      previousClassName={`select-none px-1 py-1 border shadow border-neutral-100 border-opacity-50 text-white hover:bg-neutral-300 hover:text-black ${prevButtonHidden}`}
      nextClassName={`select-none px-1 py-1 border shadow border-neutral-100 border-opacity-50 text-white hover:bg-neutral-300 hover:text-black ${nextButtonHidden}`}
      breakClassName={
        'select-none px-1 py-1 border shadow border-neutral-800 border-opacity-50 text-neutral-100 hover:text-black'
      }
      pageClassName={
        'select-none px-1 py-1 min-w-[25px] text-center border shadow border-neutral-800 border-opacity-50 text-white hover:bg-neutral-300 hover:text-black'
      }
      initialPage={pagination.current_page - 1}
    />
  );
};

export default Pagination;
