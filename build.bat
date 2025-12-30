git pull && ^
yarn && ^
yarn build && ^
rmdir /S /Q fivem\build 2>nul & ^
mkdir fivem\build && ^
xcopy dist fivem\build /E /I /Y
