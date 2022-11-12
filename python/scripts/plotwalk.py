import pandas as pd
data = pd.read_csv('data/walk.txt',sep='\s+',header=None)
data = pd.DataFrame(data)

import matplotlib.pyplot as plt
x = data[0]
y = data[1]
plt.plot(x, y,'r--')
plt.xlabel("días desde el 12/11/2022");
plt.ylabel("pasos");

plt.savefig('figures/walk.png')
