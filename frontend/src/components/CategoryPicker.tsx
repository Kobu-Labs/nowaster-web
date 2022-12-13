type SubjectPickerProps = {
  handleCategoryInputChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  categoryInput: string;
};

const CategoryPicker = (props: SubjectPickerProps) => {
  return (
    <div className="my-8">
      <input
        type="text"
        onChange={props.handleCategoryInputChange}
        value={props.categoryInput}
        className="bg-gray-900 rounded-lg h-8 text-center px-9"
        placeholder="Category"
      />
    </div>
  );
};

export default CategoryPicker;
