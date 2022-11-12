import pandas as pd
data = pd.read_csv('data/walk.txt',sep='\s+',header=None)
data = pd.DataFrame(data)

import matplotlib.pyplot as plt
x = data[0]
y = data[1]
plt.plot(x, y,'r--')
plt.xlabel("días");
plt.ylabel("km");

plt.savefig('figures/walk.png')
