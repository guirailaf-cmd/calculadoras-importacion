import "./index.css";
import { MyComposition } from "./Composition";
import { ImportCaseBreakdownComposition } from "./ImportCaseBreakdown";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <ImportCaseBreakdownComposition />
    </>
  );
};
