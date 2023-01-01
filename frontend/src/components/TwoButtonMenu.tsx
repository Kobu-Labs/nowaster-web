type TwoButtonMenuProps = {
  setActive: (toDisplay: string) => void;
  displayStringFirst: string;
  displayStringSecond: string;
  active: string;
};

const TwoButtonMenu = (props: TwoButtonMenuProps) => {
  return (
    <div className="text-sm font-medium text-center text-gray-200 border-gray-700">
      <ul className="flex flex-wrap -mb-px mx-28">
        <li className="mr-2">
          <button
            onClick={() => props.setActive(props.displayStringFirst)}
            className={`inline-block p-4 border-b-2 ${
              props.active === props.displayStringFirst
                ? "text-blue-600"
                : "text-gray-400 hover:text-blue-600"
            } rounded-t-lg hover:border-0 transition-none border-0`}
          >
            {props.displayStringFirst}
          </button>
        </li>
        <li className="mr-2">
          <button
            onClick={() => props.setActive(props.displayStringSecond)}
            className={`inline-block p-4 border-b-2 ${
              props.active === props.displayStringSecond
                ? "text-blue-600"
                : "text-gray-400 hover:text-blue-600"
            } rounded-t-lg hover:border-0 transition-none border-le border-0`}
          >
            {props.displayStringSecond}
          </button>
        </li>
      </ul>
    </div>
  );
};

export default TwoButtonMenu;
