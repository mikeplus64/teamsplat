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
{-# LANGUAGE NamedFieldPuns             #-}
{-# LANGUAGE OverloadedStrings          #-}
{-# LANGUAGE QuasiQuotes                #-}
{-# LANGUAGE RecordWildCards            #-}
{-# LANGUAGE StandaloneDeriving         #-}
{-# LANGUAGE TemplateHaskell            #-}
{-# LANGUAGE TypeFamilies               #-}
{-# LANGUAGE TypeOperators              #-}
module Api where
import           Conduit
import           Control.Applicative
import           Control.Lens                         (anyOf, firstOf, over, to,
                                                       _Just, _head)
import           Control.Monad                        (unless, void)
import           Control.Monad.IO.Class               (liftIO)
import           Control.Monad.Logger
import           Control.Monad.Reader
import qualified Data.Aeson.TH                        as JSON
import           Data.Char
import           Data.Int
import           Data.List                            ((\\))
import           Data.Maybe                           (fromMaybe)
import           Data.Maybe
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
import           System.Environment                   (lookupEnv, setEnv)
import           Text.Read                            (readMaybe)
import           Web.Heroku.Postgres                  (dbConnParams)

type Player = Text
type MapType = Text
type PasswordText = Text

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
  { ratingTable :: !Text
  , ratingWho   :: !Text
  , ratingDate  :: {-# UNPACK #-} !UTCTime
  , ratingMap   :: !Text
  , ratingElo   :: {-# UNPACK #-} !Word
  } deriving (Generic)

JSON.deriveToJSON JSON.defaultOptions
  { JSON.fieldLabelModifier = over _head toLower . drop 6 }
  ''Rating

data AuthFailure
  = NoPassword
  | InvalidPassword
  deriving (Show, Eq)

JSON.deriveToJSON JSON.defaultOptions ''AuthFailure

-- db shit
share [mkPersist sqlSettings, mkMigrate "persistMigrateAll"] [persistLowerCase|
DbVersion json
  v Int
  UniqueDbVersion v
  deriving Show Eq

TableDate json
  table Text
  created UTCTime
  deriving Show Eq
  UniqueDateTable table

Password json
  table Text
  text PasswordText
  deriving Show Eq
  UniquePasswordTable table

Ratings json
  table Text
  map Text
  who Text
  rate Rate
  pastRates [Rate]
  UniqueRatings table who map
  deriving Show Eq
  |]

deriving instance Generic (Key TableDate) -- ugly hack
deriving instance Generic (Key DbVersion) -- ugly hack
deriving instance Generic (Key Ratings) -- also an ugly hack
deriving instance Generic (Key Password) -- another ugly hack

type SqliteM = SqlPersistT (NoLoggingT (ResourceT IO))

migrations :: [SqlPersistT IO ()]
migrations =
  [ do tables <- ReaderT $ \env ->
         runResourceT (runNoLoggingT (runReaderT getAllTables env))
       mapM_
         (\t -> do
           now <- liftIO getCurrentTime
           insertUnique TableDate
             { tableDateTable = t
             , tableDateCreated = now
             })
         tables
  ]

version :: Int
version = length migrations

migrateVersions :: Migration
migrateVersions = lift $ lift $ do
  vs <- select $ from $ \dbv -> do
    orderBy [desc (dbv^.DbVersionV)]
    return (dbv^.DbVersionV)
  let cur = fromMaybe 0 (firstOf (_head . to unValue) vs)
  unless (cur == version) (sequence_ (drop cur migrations))

{-# SPECIALISE pageSize :: Int #-}
{-# SPECIALISE pageSize :: Int64 #-}
pageSize :: Num a => a
pageSize = 64

copyTable :: Text -> Text -> PasswordText -> SqliteM Bool
copyTable tblfrom tblto newpw = do
  destTable <- select $ from $ \tbl -> distinct $ do
    where_ (tbl^.RatingsTable ==. val tblto)
    return (tbl^.RatingsTable)

  case destTable of
    [] -> do
      True <- setTablePassword tblto newpw
      insertMany_ . map (\r -> (entityVal r){ ratingsTable = tblto }) =<<
        select (from (\rating -> rating <$
          where_ (rating^.RatingsTable ==. val tblfrom)))
      return True
    _ ->
      return False

getTables :: Int64 -> SqliteM [Text]
getTables page = map unValue <$>
  (select $ from $ \tbldate -> do
      orderBy [desc (tbldate^.TableDateCreated)]
      offset (pageSize * page)
      limit pageSize
      where_ $ exists $ from $ \r ->
        where_ (r^.RatingsTable ==. tbldate^.TableDateTable)
      return (tbldate^.TableDateTable))

getAllTables :: SqliteM [Text]
getAllTables = map unValue <$>
  (select $ from $ \rating -> do
      orderBy [desc (rating^.RatingsTable)]
      groupBy (rating^.RatingsTable)
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

withTableAuth :: Maybe PasswordText
              -> Text
              -> SqliteM a
              -> SqliteM (Either AuthFailure a)
withTableAuth Nothing _table _f = return (Left NoPassword)
withTableAuth (Just pw) table f = do
  actualPw <- P.getBy (UniquePasswordTable table)
  case actualPw of
    Just (Entity _ pass) | pw == passwordText pass -> Right <$> f
    _                                              -> return (Left InvalidPassword)

setRatings :: PasswordText
           -> Text
           -> Player
           -> MapType
           -> Word
           -> Maybe Text
           -> SqliteM (Either AuthFailure ())
setRatings mpw table player maptype elo _caveat = withTableAuth (Just mpw) table $ do
  unless (maptype `elem` mapTypes) (fail "Invalid map type")
  time <- liftIO getCurrentTime
  mrs  <- P.getBy (UniqueRatings table player maptype)
  case mrs of
    Just (Entity k _) -> void (replace k Ratings
      { ratingsTable = table
      , ratingsMap = maptype
      , ratingsWho = player
      , ratingsRate = (time, elo)
      , ratingsPastRates = [] -- ratingsRate rs : ratingsPastRates rs
      })
    Nothing -> insert_ Ratings
      { ratingsTable = table
      , ratingsMap = maptype
      , ratingsWho = player
      , ratingsRate = (time, elo)
      , ratingsPastRates = []
      }

deletePlayer :: PasswordText -> Text -> Player -> SqliteM (Either AuthFailure ())
deletePlayer mpw table player = withTableAuth (Just mpw) table $
  P.deleteWhere [RatingsTable P.==. table, RatingsWho P.==. player]

setTablePassword :: Text -> PasswordText -> SqliteM Bool
setTablePassword table pass = do
  m <- P.insertUnique Password
    { passwordTable = table
    , passwordText = pass
    }
  case m of
    Just _ -> do
      now <- liftIO getCurrentTime
      Just _ <- P.insertUnique TableDate{tableDateTable = table, tableDateCreated = now}
      return True
    Nothing -> do
      ep <- P.getBy (UniquePasswordTable table)
      case ep of
        Just Entity{entityVal = Password{passwordText}} ->
          return (pass == passwordText)
        _ ->
          -- Password apparently existed before, but could not get it now
          return False

--------------------------------------------------------------------------------

type Api =
       "tables" :> Capture "page" Int64 :> Get '[JSON] [Text]
  :<|> "copy"
    :> Capture "from" Text
    :> Capture "to" Text
    :> Capture "password" PasswordText
    :> Post '[JSON] Bool
  :<|> "players" :> Capture "page" Int64 :> Get '[JSON] [Text]
  :<|> "maps" :> Get '[JSON] [MapType]
  :<|> "rate"
    :> "history"
    :> Capture "table" Text
    :> Capture "player" Text
    :> Get '[JSON] [Rating]
  :<|> "rate"
    :> Capture "password" PasswordText
    :> Capture "table" Text
    :> Capture "player" Player
    :> Capture "map" MapType
    :> Capture "elo" Word
    :> Capture "caveat" (Maybe Text)
    :> Post '[JSON] (Either AuthFailure ())
  :<|> "delete"
    :> Capture "password" PasswordText
    :> Capture "table" Text
    :> Capture "player" Player
    :> Post '[JSON] (Either AuthFailure ())
  :<|> "table"  :> Capture "table" Text :> Get '[JSON] [Rating]
  :<|> "set_password"
    :> Capture "table" Text
    :> Capture "password" PasswordText
    :> Get '[JSON] Bool

type ApiWithStatic = Api :<|> Raw

api :: Proxy ApiWithStatic
api = Proxy

server :: ConnectionPool -> Server Api
server pool =
  sql . getTables
  :<|> (\a b pw -> sql (copyTable a b pw))
  :<|> sql . getPlayers
  :<|> return mapTypes
  :<|> (\table player -> sql (ratingHistory table player))
  :<|> (\pw table player maptype elo caveat ->
    sql (setRatings pw table player maptype elo caveat))
  :<|> (\pw table player -> sql (deletePlayer pw table player))
  :<|> sql . getRatings
  :<|> (\table password -> sql (setTablePassword table password))
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
  runSqlPool (runMigration persistMigrateAll) pool
  runSqlPool (runMigration migrateVersions) pool
  return (serve api (server pool :<|> serveDirectoryFileServer "dist"))

{-# NOINLINE js #-}
js :: Text
js = jsForAPI
     (Proxy :: Proxy Api)
     (vanillaJSWith defCommonGeneratorOptions
      { moduleName = "module.exports"
      })

startDev :: IO ()
startDev = do
  setEnv "USE_SQLITE" "True"
  setEnv "PORT" "8080"
  start

start :: IO ()
start = do
  dev <- anyOf (_Just . to readMaybe . _Just) id <$> lookupEnv "USE_SQLITE"
  port <- fromMaybe 80 . (readMaybe =<<) <$> lookupEnv "PORT"
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
  Warp.runEnv port . logStdoutDev =<< makeApplication dev params
