import           Api                (start, startDev)
import           System.Environment

main :: IO ()
main = do
  args <- getArgs
  case args of
    "--dev":xs -> withArgs xs startDev
    _          -> start
