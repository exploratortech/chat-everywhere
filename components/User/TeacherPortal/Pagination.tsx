import ReactPaginate from 'react-paginate';

import { Pagination as PaginationType } from '@/types/pagination';

const Pagination = ({
  pagination,
  handlePageChange,
}: {
  pagination: PaginationType;
  handlePageChange: (page: number) => void;
}) => {
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
      activeClassName={'px-1 !text-black bg-white border-neutral-800'}
      previousClassName={
        'px-1 py-1 border shadow border-neutral-100 border-opacity-50 text-white hover:bg-neutral-300 hover:text-black'
      }
      nextClassName={
        'px-1 py-1 border shadow border-neutral-100 border-opacity-50 text-white hover:bg-neutral-300 hover:text-black'
      }
      breakClassName={
        'px-1 py-1 border shadow border-neutral-800 border-opacity-50 text-neutral-100 hover:text-black'
      }
      pageClassName={
        'px-1 py-1 border shadow border-neutral-800 border-opacity-50 text-white hover:bg-neutral-300 hover:text-black'
      }
      initialPage={pagination.current_page - 1} // react-paginate uses zero indexing for pages
    />
  );
};

export default Pagination;
