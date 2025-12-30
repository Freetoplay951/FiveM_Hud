git pull && ^
yarn && ^
yarn build && ^
( if exist fivem\build rmdir /S /Q fivem\build ) && ^
mkdir fivem\build && ^
xcopy dist fivem\build /E /I /Y
