-- elo db api by mmike
--
-- generates a javascript API given a specific url prefix
-- (maybe useful for putting it behind e.g. nginx) and starts
-- the associated server for it
--
-- quick & dirty invocation:
-- $ stack teamsplit.hs url_prefix > api.js
-- $ stack teamsplit.hs http://localhost > api.js
--
-- though compiling it is will let it run much faster:
-- $ stack ghc -- teamsplit.hs -O2 -threaded
-- $ ./teamsplit http://localhost > api.js
{-# LANGUAGE DataKinds                  #-}
{-# LANGUAGE DeriveAnyClass             #-}
{-# LANGUAGE DeriveGeneric              #-}
{-# LANGUAGE ExistentialQuantification  #-}
{-# LANGUAGE FlexibleInstances          #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE MultiParamTypeClasses      #-}
{-# LANGUAGE OverloadedStrings          #-}
{-# LANGUAGE QuasiQuotes                #-}
{-# LANGUAGE RecordWildCards            #-}
{-# LANGUAGE StandaloneDeriving         #-}
{-# LANGUAGE TemplateHaskell            #-}
{-# LANGUAGE TypeFamilies               #-}
{-# LANGUAGE TypeOperators              #-}
module Api where
import           Conduit
import qualified Control.Lens                         as L
import           Control.Monad                        (void)
import           Control.Monad.IO.Class               (liftIO)
import           Control.Monad.Logger
import qualified Data.Aeson.TH                        as JSON
import           Data.Char
import           Data.Int
import           Data.Proxy
import           Data.Text                            (Text)
import qualified Data.Text                            as T
import qualified Data.Text.Encoding                   as T
import           Data.Time
import           Database.Esqueleto
import qualified Database.Persist                     as P
import           Database.Persist.Postgresql          (ConnectionPool,
                                                       createPostgresqlPool,
                                                       runMigration,
                                                       runSqlPersistMPool,
                                                       runSqlPool)
import           Database.Persist.Sqlite              (createSqlitePool)
import           Database.Persist.TH                  (mkMigrate, mkPersist,
                                                       persistLowerCase, share,
                                                       sqlSettings)
import           GHC.Generics                         (Generic)
import qualified Network.Wai.Handler.Warp             as Warp (runEnv)
import           Network.Wai.Middleware.RequestLogger
import           Servant
import           Servant.JS
import           System.Environment
import           Web.Heroku.Postgres                  (dbConnParams)

type Player = Text
type MapType = Text

mapTypes :: [MapType]
mapTypes =
  [ "boom (open)"
  , "boom (closed)"
  , "open"
  , "water"
  , "nomad"
  ]

--------------------------------------------------------------------------------

type Rate = (UTCTime, Word)

data Rating = Rating
  { ratingTable :: Text
  , ratingWho   :: Text
  , ratingDate  :: UTCTime
  , ratingMap   :: Text
  , ratingElo   :: Word
  } deriving (Generic)

JSON.deriveToJSON JSON.defaultOptions
  { JSON.fieldLabelModifier = L.over L._head toLower . drop 6 }
  ''Rating

-- db shit
share [mkPersist sqlSettings, mkMigrate "migrateAll"] [persistLowerCase|
Ratings json
  table Text
  map Text
  who Text
  rate Rate
  pastRates [Rate]
  UniqueRatings table who map
  deriving Show Eq
  |]

deriving instance Generic (Key Ratings) -- ugly hack
type SqliteM = SqlPersistT (NoLoggingT (ResourceT IO))

{-# SPECIALISE pageSize :: Int #-}
{-# SPECIALISE pageSize :: Int64 #-}
pageSize :: Num a => a
pageSize = 64

getTables :: Int64 -> SqliteM [Text]
getTables page =
  map unValue <$>
  (select $ from $ \rating -> do
      orderBy [desc (rating^.RatingsTable)]
      groupBy (rating^.RatingsTable)
      offset (pageSize * page)
      limit pageSize
      return (rating^.RatingsTable))

getRatings :: Text -> SqliteM [Rating]
getRatings table =
  map (currentRating . entityVal) <$> (
  select $ from $ \rating -> do
    where_ (rating^.RatingsTable ==. val table)
    return rating)

currentRating :: Ratings -> Rating
currentRating Ratings{..} = Rating
  { ratingTable = ratingsTable
  , ratingMap = ratingsMap
  , ratingWho = ratingsWho
  , ratingElo = snd ratingsRate
  , ratingDate = fst ratingsRate
  }

allRatings :: Ratings -> [Rating]
allRatings r@Ratings{..} = currentRating r : map
  (\(date, elo) -> Rating
    { ratingTable = ratingsTable
    , ratingMap = ratingsMap
    , ratingWho = ratingsWho
    , ratingElo = elo
    , ratingDate = date })
  ratingsPastRates

ratingHistory :: Text -> Text -> SqliteM [Rating]
ratingHistory table who =
  concatMap (allRatings . entityVal) <$> (
  select $ from $ \ratings -> do
  where_ (ratings^.RatingsTable ==. val table &&.
          ratings^.RatingsWho ==. val who)
  return ratings)

getPlayers :: Int64 -> SqliteM [Text]
getPlayers page = map unValue <$> select (distinct (from (\r -> do
  offset (pageSize * page)
  limit pageSize
  return (r^.RatingsWho))))

setRatings :: Text -> Player -> MapType -> Word -> Maybe Text -> SqliteM ()
setRatings table player maptype elo _caveat = do
  unless (maptype `elem` mapTypes) (fail "Invalid map type")
  time <- liftIO getCurrentTime
  mrs  <- P.getBy (UniqueRatings table player maptype)
  case mrs of
    Just (Entity k rs) -> void (replace k Ratings
      { ratingsTable = table
      , ratingsMap = maptype
      , ratingsWho = player
      , ratingsRate = (time, elo)
      , ratingsPastRates = ratingsRate rs : ratingsPastRates rs
      })
    Nothing -> insert_ Ratings
      { ratingsTable = table
      , ratingsMap = maptype
      , ratingsWho = player
      , ratingsRate = (time, elo)
      , ratingsPastRates = []
      }

--------------------------------------------------------------------------------

type Api =
       "tables" :> Capture "page" Int64 :> Get '[JSON] [Text]
  :<|> "players" :> Capture "page" Int64 :> Get '[JSON] [Text]
  :<|> "maps" :> Get '[JSON] [MapType]
  :<|> "rate"
    :> "history"
    :> Capture "table" Text
    :> Capture "player" Text
    :> Get '[JSON] [Rating]
  :<|> "rate"
    :> Capture "table" Text
    :> Capture "player" Player
    :> Capture "map" MapType
    :> Capture "elo" Word
    :> Capture "caveat" (Maybe Text)
    :> Post '[JSON] Bool
  :<|> "table"  :> Capture "table" Text :> Get '[JSON] [Rating]

type ApiWithStatic = Api :<|> Raw

api :: Proxy ApiWithStatic
api = Proxy

server :: ConnectionPool -> Server Api
server pool =
  sql . getTables
  :<|> sql . getPlayers
  :<|> return mapTypes
  :<|> (\table player -> sql (ratingHistory table player))
  :<|> (\table player maptype elo caveat -> do
           sql (setRatings table player maptype elo caveat)
           return True)
  :<|> sql . getRatings
  where
    sql :: SqlPersistT (NoLoggingT (ResourceT IO)) a -> Handler a
    sql f = liftIO (runSqlPersistMPool f pool)

-- host=localhost port=5432 user=test dbname=test password=test
makeConnStr :: [(Text, Text)] -> Text
makeConnStr params = T.unwords [ T.concat [k, "=", v] | (k, v) <- params ]

makeApplication :: Bool -> [(Text, Text)] -> IO Application
makeApplication dev params = do
  pool <- runStderrLoggingT $
    if dev
    then createSqlitePool "teamsplit.sqlite" 10
    else createPostgresqlPool (T.encodeUtf8 (makeConnStr params)) 10
  runSqlPool (runMigration migrateAll) pool
  return (serve api (server pool :<|> serveDirectory "dist"))

{-# NOINLINE js #-}
js :: Text
js = jsForAPI
     (Proxy :: Proxy Api)
     (vanillaJSWith defCommonGeneratorOptions
      { moduleName = "module.exports"
      })

start :: IO ()
start = do
  let
    dev :: Bool
    dev = False
  params <- do
    url <- lookupEnv "DATABASE_URL"
    case url of
      Just _ -> dbConnParams
      Nothing -> return
        [ ("host", "localhost")
        , ("port", "5432")
        , ("user", "postgres")
        , ("dbname", "teamsplat")
        , ("password", "")
        ]
  Warp.runEnv 80 . logStdoutDev =<< makeApplication dev params
