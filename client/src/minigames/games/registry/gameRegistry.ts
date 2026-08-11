import QuizEngine from '../engines/QuizEngine/QuizEngine';
import MemoryEngine from '../engines/MemoryEngine/MemoryEngine';
import PuzzleEngine from '../engines/PuzzleEngine/PuzzleEngine';
import DragDropEngine from '../engines/DragDropEngine/DragDropEngine';
import TapPopEngine from '../engines/TapPopEngine/TapPopEngine';
import SequenceEngine from '../engines/SequenceEngine/SequenceEngine';
import MathRunnerEngine from '../engines/MathRunnerEngine/MathRunnerEngine';
import WordBuilderEngine from '../engines/WordBuilderEngine/WordBuilderEngine';
import LogicGridEngine from '../engines/LogicGridEngine/LogicGridEngine';
import CityBuilderEngine from '../engines/CityBuilderEngine/CityBuilderEngine';
import CodingLiteEngine from '../engines/CodingLiteEngine/CodingLiteEngine';
import FinanceEngine from '../engines/FinanceEngine/FinanceEngine';
import JigsawEngine from '../engines/JigsawEngine/JigsawEngine';
import PatternEngine from '../engines/PatternEngine/PatternEngine';
import MazeEngine from '../engines/MazeEngine/MazeEngine';
import SpotDiffEngine from '../engines/SpotDiffEngine/SpotDiffEngine';
import SudokuEngine from '../engines/SudokuEngine/SudokuEngine';
import WaterTrackerEngine from '../engines/WaterTrackerEngine/WaterTrackerEngine';
import SleepGuardianEngine from '../engines/SleepGuardianEngine/SleepGuardianEngine';
import BreathingEngine from '../engines/BreathingEngine/BreathingEngine';

export const gameRegistry: Record<string, React.ComponentType<any>> = {
    quiz: QuizEngine,
    memory: MemoryEngine,
    puzzle: PuzzleEngine,
    dragdrop: DragDropEngine,
    tappop: TapPopEngine,
    sequence: SequenceEngine,
    mathrunner: MathRunnerEngine,
    wordbuilder: WordBuilderEngine,
    logicgrid: LogicGridEngine,
    citybuilder: CityBuilderEngine,
    codinglite: CodingLiteEngine,
    finance: FinanceEngine,
    jigsaw: JigsawEngine,
    pattern: PatternEngine,
    maze: MazeEngine,
    spotdiff: SpotDiffEngine,
    sudoku: SudokuEngine,
    watertracker: WaterTrackerEngine,
    sleepguardian: SleepGuardianEngine,
    breathing: BreathingEngine,
};
