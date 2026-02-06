import React from "react";
import { cn } from "../../../utils/cn";
import { FiSearch } from "react-icons/fi";

type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  wrapperClassName?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({
  wrapperClassName,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative flex w-full items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:border-gray-700",
        wrapperClassName
      )}
    >
      <FiSearch className="mr-2 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-400" />
      <input
        className={cn(
          "w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-gray-400",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default SearchInput;

