## upbit-volatility-breakthrough-private-backtest

upbit 변동성 돌파전략 back-test

### todo

- 4시간봉, 1일봉으로 변동성 돌파전략을 적용했을 경우, 하루 수익률(Daily Rate of Return), 누적 수익률(Cumulative Rate of Return, crr), 손실률(Draw Down, dd)이 나오는지 계산
- 투자금은 동일하게
- 비트코인, 리플, 이더리움, 이더리움클래식... 을 테스트. 많이 들어보고 적당한 변동성이 있는게 더 있는지 고민
  - 실제 서비스하게 된다면 5 ~ 10개 종목을 돌리고 싶은데...
- range = high_price - low_price
- target_value = opening_value + (range * K). K = 0.5
- drr (Daily Rate of Return) = 고가가 target_value보다 클 때, 실매도가/실매수가-1. 고가가 target_value보다 작을 때, 거래없음. 0.
  - `실매도가 * (1 + 수수료) = 매도가`, `실매도가 = 매도가 / (1 + 수수료)`
  - `실매수가 = 매수가 * (1 + 수수료)`
  - `수익률 = 실매도가 / 실매수가 - 1`, `수익률 = (매도가 / (1 + 수수료)) / (매수가 * (1 + 수수료))`,  `수익률 = (매도가 / 1.0005) / (매수가 * 1.0005)`
  - 수수료는 원화 0.05%, btc 0.25%
- crr (Cumnulative Rate of Return) = 전체 날짜 (drr + 1)의 곱 - 1

