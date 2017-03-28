import           Api          (js)
import qualified Data.Text.IO as T

main :: IO ()
main = T.writeFile "api.js" js
