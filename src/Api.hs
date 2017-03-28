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
module Api (start, js) where
import           Conduit
import           Control.Monad.IO.Class               (liftIO)
import           Control.Monad.Logger
import           Data.Int
import           Data.Proxy
import           Data.Text                            (Text)
import           Data.Time
import           Database.Esqueleto
import           Database.Persist.Sqlite              (ConnectionPool,
                                                       createSqlitePool,
                                                       runMigration,
                                                       runSqlPersistMPool,
                                                       runSqlPool)
import           Database.Persist.TH                  (mkMigrate, mkPersist,
                                                       persistLowerCase, share,
                                                       sqlSettings)
import           GHC.Generics                         (Generic)
import qualified Network.Wai.Handler.Warp             as Warp (run)
import           Network.Wai.Middleware.RequestLogger
import           Servant
import           Servant.JS

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

-- db shit
share [mkPersist sqlSettings, mkMigrate "migrateAll"] [persistLowerCase|
Rating json
  date UTCTime
  table Text
  map Text
  who Text
  elo Word
  caveat Text Maybe
  deriving Show Eq
  |]

deriving instance Generic (Key Rating) -- ugly hack
type SqliteM = SqlPersistT (NoLoggingT (ResourceT IO))

{-# SPECIALISE pageSize :: Int #-}
{-# SPECIALISE pageSize :: Int64 #-}
pageSize :: Num a => a
pageSize = 64

getTables :: Int64 -> SqliteM [Text]
getTables page =
  map unValue <$>
  (select $ from $ \rating -> do
      orderBy [desc (rating^.RatingDate)]
      offset (pageSize * page)
      limit pageSize
      groupBy (rating^.RatingTable)
      return (rating^.RatingTable))

getRatings :: Text -> SqliteM [Rating]
getRatings table =
  map entityVal <$> (
  select $ from $ \rating -> do
    where_ (rating^.RatingTable ==. val table)
    orderBy [desc (rating^.RatingDate)]
    groupBy (rating^.RatingWho)
    return rating)

getAllRatings :: Text -> SqliteM [Rating]
getAllRatings table =
  map entityVal <$> (
  select $ from $ \rating -> do
    where_ (rating^.RatingTable ==. val table)
    orderBy [desc (rating^.RatingDate)]
    return rating)

ratingHistory :: Text -> Text -> SqliteM [Rating]
ratingHistory table who =
  map entityVal <$> (
  select $ from $ \rating -> do
    where_ (rating^.RatingTable ==. val table &&. rating^.RatingWho ==. val who)
    orderBy [asc (rating^.RatingDate)]
    return rating)

getPlayers :: Int64 -> SqliteM [Text]
getPlayers page =
  map unValue <$>
  select (distinct (from (\r -> do
    offset (pageSize * page)
    limit pageSize
    return (r^.RatingWho))))

setRating :: Text -> Player -> MapType -> Word -> Maybe Text -> SqliteM ()
setRating table player maptype elo caveat = do
  time <- liftIO getCurrentTime
  insert_ Rating
    { ratingDate = time
    , ratingTable = table
    , ratingMap = maptype
    , ratingWho = player
    , ratingElo = elo
    , ratingCaveat = caveat
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
           sql (setRating table player maptype elo caveat)
           return True)
  :<|> sql . getRatings
  where
    sql :: SqlPersistT (NoLoggingT (ResourceT IO)) a -> Handler a
    sql f = liftIO (runSqlPersistMPool f pool)

makeApplication :: IO Application
makeApplication = do
  pool <- runStderrLoggingT (createSqlitePool "teamsplit.sqlite" 10)
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
start = Warp.run 80 . logStdoutDev =<< makeApplication
